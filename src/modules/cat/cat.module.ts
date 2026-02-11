import { Module } from '@nestjs/common';
import { CatController } from './cat.controller';

@Module({
  controllers: [CatController],
  providers: [],
})
export class CatModule {}
