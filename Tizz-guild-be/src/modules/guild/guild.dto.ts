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

export class CreateGuildDto {
  @ApiProperty({
    required: true,
    description: "name",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    required: true,
    description: "description",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  description: string;
  @ApiProperty({
    required: true,
    description: "picture",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  picture: string;

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
  telegram: string;

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
  twitter: string;

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
  discord: string;

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
  website: string;
}

export class UpdateGuildDto extends CreateGuildDto {
  @ApiProperty({
    required: true,
    description: "guild_id",
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  guild_id: number;
}

export class joinGuilDto {
  @ApiProperty({
    required: true,
    description: "guild_id",
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  guild_id: number;
}

export class joinRequestGuilDto {
  @ApiProperty({
    required: true,
    description: "action_id",
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  action_id: number;
}

export class invitationRequestDto extends joinGuilDto {
  @ApiProperty({
    required: true,
    description: "user_id",
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;
}

export class invitationRequesbyAddressDto {
  @ApiProperty({
    required: true,
    description: "address",
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  address: string;
  @ApiProperty({
    required: true,
    description: "guild_id",
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  guild_id: number;
}
