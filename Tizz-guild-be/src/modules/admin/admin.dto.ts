import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  //   IsArray,
  //   ValidateNested,
  IsNumber,
  IsDate,
  //   IsBoolean,
  //   IsOptional,
  //   Matches,
} from "class-validator";

export class AuthDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  wallet_address: `0x${string}`;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  signature: `0x${string}`;
  @ApiProperty()
  @IsNumber()
  timestamp: number;
}

export class userActionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}

export class createTrendingRoundDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  start_time: Date;
  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  end_time: Date;
}

export class endTrendingRoundDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  round_id: number;
}
export class modifyTradingRoundDto extends createTrendingRoundDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  round_id: number;
}
