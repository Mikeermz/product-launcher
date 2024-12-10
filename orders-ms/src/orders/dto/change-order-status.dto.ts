import { OrderStatus } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatusList } from './enum/order.enum';

export class changeOrderStatus {
  @IsUUID(4)
  id: string;
  @IsEnum(OrderStatusList, {
    message: `Status must be one of the following: ${OrderStatusList.join(', ')}`,
  })
  status: OrderStatus;
}
