import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus, OrderStatusList } from './enum/order.enum';

export class StatusDto {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `Status must be one of the following: ${OrderStatusList.join(', ')}`,
  })
  status: OrderStatus;
}
