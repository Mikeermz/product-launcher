import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { changeOrderStatus, CreateOrderDto, OrderPaginationDto } from './dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(NATS_SERVICE) private readonly productsClient: ClientProxy,
  ) {
    super();
  }
  private readonly logger = new Logger('OrdersService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      // 1 Check if the products exist
      const productsIds = createOrderDto.items.map((item) => item.productId);
      const products: any[] = await firstValueFrom(
        this.productsClient.send({ cmd: 'validate_product' }, productsIds),
      );

      // 2 Calculate the total amount and total items
      const totalAmount = createOrderDto.items.reduce((_acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;
        return price * orderItem.quantity;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      // 3 Create the order
      const order = await this.order.create({
        data: {
          totalAmount,
          totalItem: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(
                  (product) => product.id === orderItem.productId,
                ).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId)
            .name,
        })),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Check logs ${error.message}`,
      });
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const totalPages = await this.order.count({
      where: {
        status: orderPaginationDto.status,
      },
    });

    const currentPage = orderPaginationDto.page;
    const limit = orderPaginationDto.limit;

    return {
      data: await this.order.findMany({
        where: {
          status: orderPaginationDto.status,
        },
        skip: (currentPage - 1) * limit,
        take: limit,
      }),
      meta: {
        totalItems: totalPages,
        currentPage,
        totalPages: Math.ceil(totalPages / limit),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order whit id ${id} not found`,
      });
    }

    const productsIds = order.OrderItem.map((orderItem) => orderItem.productId);

    const products: any[] = await firstValueFrom(
      this.productsClient.send({ cmd: 'validate_product' }, productsIds),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id === orderItem.productId)
          .name,
      })),
    };
  }

  async changeOrderStatus(changeOrderStatusDto: changeOrderStatus) {
    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne(id);

    if (order.status === status) {
      return order;
    }

    return this.order.update({
      where: { id },
      data: { status: status },
    });

    // if (!order) {
    //   throw new RpcException({
    //     status: HttpStatus.NOT_FOUND,
    //     message: `Order whit id ${changeOrderStatusDto.orderId} not found`,
    //   });
    // }

    // return this.order.update({
    //   where: { id: changeOrderStatusDto.orderId },
    //   data: { status: changeOrderStatusDto.status },
    // });
  }
}
