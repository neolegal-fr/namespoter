import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { DomainSuggestion } from './entities/domain-suggestion.entity';
import { ProjectShare } from './entities/project-share.entity';
import { ProjectSharesService } from './project-shares.service';
import { KeycloakAdminService } from './keycloak-admin.service';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, DomainSuggestion, ProjectShare]),
    UsersModule,
    MailModule,
  ],
  providers: [ProjectsService, ProjectSharesService, KeycloakAdminService],
  controllers: [ProjectsController],
  exports: [ProjectsService, ProjectSharesService]
})
export class ProjectsModule {}
