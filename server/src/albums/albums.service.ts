import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { Album } from './entities/album.entity';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private albumsRepository: Repository<Album>,
  ) {}

  create(createAlbumDto: CreateAlbumDto) {
    const album = this.albumsRepository.create(createAlbumDto);
    return this.albumsRepository.save(album);
  }

  findAll() {
    return this.albumsRepository.find();
  }

  findOne(id: number) {
    return this.albumsRepository.findOneBy({ id });
  }

  async update(id: number, updateAlbumDto: UpdateAlbumDto) {
    const album = await this.albumsRepository.preload({
      id: +id,
      ...updateAlbumDto,
    });
    if (!album) throw new NotFoundException(`Album #${id} not found`);
    return this.albumsRepository.save(album);
  }

  async remove(id: number) {
    const album = await this.findOne(id);
    if (!album) throw new NotFoundException(`Album #${id} not found`);
    return this.albumsRepository.remove(album);
  }
}
