import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  //   IsArray,
  //   ValidateNested,
  IsNumber,
  //   IsBoolean,
  IsOptional,
  Matches,
} from "class-validator";
// import { Type } from 'class-transformer';

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

export class UpdateUserDto {
  @ApiProperty({
    required: false,
    description: "bio",
    type: String,
  })
  @IsString()
  @IsOptional()
  bio: `string`;

  @ApiProperty({
    required: false,
    description: "discord",
    type: String,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{2,32}#[0-9]{4}$/, {
    message: "Invalid Discord username format.",
  })
  discord: `string`;

  @ApiProperty({
    required: false,
    description: "github",
    type: String,
  })
  @IsOptional()
  @IsString()
  github: `string`;

  @ApiProperty({
    required: false,
    description: "pfp",
    type: String,
  })
  @IsOptional()
  @IsString()
  pfp: `string`;

  @ApiProperty({
    required: false,
    description: "telegram",
    type: String,
  })
  @IsOptional()
  @IsString()
  @Matches(/^@?[a-zA-Z0-9_]{5,}$/, {
    message: "Invalid Telegram username format.",
  })
  telegram: `string`;

  @ApiProperty({
    required: false,
    description: "twitter",
    type: String,
  })
  @IsOptional()
  @IsString()
  @Matches(/^@?(\w){1,15}$/, {
    message: "Invalid Twitter username format.",
  })
  twitter: `string`;

  @ApiProperty({
    required: false,
    description: "website",
    type: String,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.+)?$/, {
    message: "Invalid website URL format.",
  })
  website: `string`;
}
