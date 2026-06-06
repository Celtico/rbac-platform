import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { PaginationDto } from './dto/pagination.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions, Public } from '../auth/decorators/roles.decorator';

// Només imatges: evita pujar HTML/SVG servits des de /uploads (XSS emmagatzemat).
const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('photos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('photos')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Post()
  @Permissions('write:photos')
  create(@Body() createAlbumDto: CreateAlbumDto) {
    return this.albumsService.create(createAlbumDto);
  }

  @Post('upload')
  @Permissions('write:photos')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const isImageMime = file.mimetype.startsWith('image/');
        if (!isImageMime || !ALLOWED_IMAGE_EXT.includes(ext)) {
          return cb(
            new BadRequestException(
              'Només es permeten imatges (jpg, jpeg, png, gif, webp).',
            ),
            false,
          );
        }
        cb(null, true);
      },
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          // Normalitzem l'extensió a minúscules i a la llista blanca.
          const ext = extname(file.originalname).toLowerCase();
          return cb(null, `${randomName}${ext}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Cap fitxer rebut o fitxer rebutjat.');
    }
    return {
      url: `/uploads/${file.filename}`,
    };
  }

  @Get('page-sizes')
  @Public()
  @ApiOperation({ summary: 'Get available page size options' })
  getPageSizes() {
    return { pageSizes: [5, 10, 20, 50, 100] };
  }

  @Get()
  @Public()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.albumsService.findAll(paginationDto);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.albumsService.findOne(+id);
  }

  @Patch(':id')
  @Permissions('write:photos')
  update(@Param('id') id: string, @Body() updateAlbumDto: UpdateAlbumDto) {
    return this.albumsService.update(+id, updateAlbumDto);
  }

  @Delete(':id')
  @Permissions('write:photos')
  remove(@Param('id') id: string) {
    return this.albumsService.remove(+id);
  }
}
