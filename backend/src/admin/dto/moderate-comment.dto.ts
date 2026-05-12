import { IsIn } from 'class-validator';

export class ModerateCommentDto {
  @IsIn(['visible', 'rejected'])
  status!: 'visible' | 'rejected';
}
