import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { PaginationDto } from 'src/common';
import { NATS_SERVICE } from 'src/config';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post()
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.client.send({ cmd: 'create' }, createProductDto);
  }

  @Get()
  finddAllProducts(@Query() paginationDto: PaginationDto) {
    return this.client.send({ cmd: 'find_all' }, paginationDto);
  }

  @Get(':id')
  async findOneProduct(@Param('id') id: string) {
    // try {
    //   const product = await firstValueFrom(
    //     this.client.send({ cmd: 'find_one' }, { id }),
    //   );

    //   return product;
    // } catch (error) {
    //   throw new RpcException(error);
    // }

    return this.client.send({ cmd: 'find_one' }, { id }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Patch(':id')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.client
      .send({ cmd: 'update' }, { id, ...updateProductDto })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  @Delete(':id')
  removeProduct(@Param('id', ParseIntPipe) id: number) {
    return this.client.send({ cmd: 'remove' }, { id }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
