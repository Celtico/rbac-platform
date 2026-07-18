import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('manage:users')
  @ApiOperation({ summary: 'Create user (requires manage:users permission)' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions('read:users')
  @ApiOperation({ summary: 'List users (requires read:users permission)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Permissions('read:users')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Permissions('manage:users')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: { user?: { userId: number } },
  ) {
    return this.usersService.update(+id, updateUserDto, req.user?.userId);
  }

  @Delete(':id')
  @Permissions('manage:users')
  remove(
    @Param('id') id: string,
    @Request() req: { user?: { userId: number } },
  ) {
    return this.usersService.remove(+id, req.user?.userId);
  }
}
