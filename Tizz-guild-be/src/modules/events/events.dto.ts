import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  //   IsArray,
  //   ValidateNested,
  IsNumber,
  // IsDate,
  //   IsBoolean,
  //   IsOptional,
  //   Matches,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;
  @ApiProperty()
  @IsNotEmpty()
  eventType: 'USER' | 'GUILD';
}

export class CreateTaskDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  eventId: number;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  points: number;
}
