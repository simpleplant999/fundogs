import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const CONTACT_MESSAGE_CATEGORIES = ['REPORT_PROBLEM', 'GENERAL_QUESTION'] as const;
export type ContactMessageCategoryInput = (typeof CONTACT_MESSAGE_CATEGORIES)[number];

export class CreateContactMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsIn([...CONTACT_MESSAGE_CATEGORIES])
  category!: ContactMessageCategoryInput;

  @IsString()
  @MinLength(10, { message: 'Please add a bit more detail (at least 10 characters).' })
  @MaxLength(8000)
  message!: string;
}
