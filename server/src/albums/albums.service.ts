import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { Photo } from './entities/album.entity';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Photo)
    private photosRepository: Repository<Photo>,
  ) {}

  create(createAlbumDto: CreateAlbumDto) {
    const photo = this.photosRepository.create(createAlbumDto);
    return this.photosRepository.save(photo);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.photosRepository.createQueryBuilder('photo');

    if (search) {
      queryBuilder.where(
        'photo.title LIKE :search OR photo.description LIKE :search',
        { search: `%${search}%` },
      );
    }

    const [items, totalItems] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  findOne(id: number) {
    return this.photosRepository.findOneBy({ id });
  }

  async update(id: number, updateAlbumDto: UpdateAlbumDto) {
    const photo = await this.photosRepository.preload({
      id: +id,
      ...updateAlbumDto,
    });
    if (!photo) throw new NotFoundException(`Photo #${id} not found`);
    return this.photosRepository.save(photo);
  }

  async remove(id: number) {
    const photo = await this.findOne(id);
    if (!photo) throw new NotFoundException(`Photo #${id} not found`);
    return this.photosRepository.remove(photo);
  }
}
