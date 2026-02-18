import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOrCreate(keycloakId: string, email?: string): Promise<User> {
    let user = await this.usersRepository.findOne({ where: { keycloakId } });

    if (!user) {
      user = this.usersRepository.create({
        keycloakId,
        email,
        credits: 100,
      });
      user = await this.usersRepository.save(user);
    }

    return user;
  }

  async getCredits(keycloakId: string): Promise<number> {
    const user = await this.findOrCreate(keycloakId);
    return user.credits;
  }

  async decrementCredits(keycloakId: string, amount: number, manager?: EntityManager): Promise<boolean> {
    const repo = manager ? manager.getRepository(User) : this.usersRepository;
    const user = await repo.findOne({ where: { keycloakId } });

    if (!user || user.credits < amount) {
      return false;
    }

    user.credits -= amount;
    await repo.save(user);
    return true;
  }

  async addCredits(keycloakId: string, amount: number): Promise<void> {
    const user = await this.findOrCreate(keycloakId);
    user.credits += amount;
    await this.usersRepository.save(user);
  }
}
