import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../models/api.models';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatCardModule
    ],
    template: `
    <div class="dashboard-container">
      <mat-toolbar color="primary">
        <span class="logo">LEMS Platform</span>
        <span class="spacer"></span>
        <button mat-button routerLink="/dashboard">Dashboard</button>
        <button mat-button routerLink="/content">Content</button>
        <button mat-button routerLink="/questions">Questions</button>
        <button mat-button routerLink="/tests">Tests</button>
        <button mat-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
          {{ currentUser?.firstName }}
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            Profile
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            Logout
          </button>
        </mat-menu>
      </mat-toolbar>

      <div class="dashboard-content">
        <h1>Welcome, {{ currentUser?.firstName }}!</h1>
        
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-header>
              <mat-card-title>My Courses</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-value">12</div>
              <p>Active courses</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-header>
              <mat-card-title>Tests Taken</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-value">45</div>
              <p>Completed tests</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-header>
              <mat-card-title>Average Score</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-value">85%</div>
              <p>Overall performance</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-header>
              <mat-card-title>Certificates</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-value">8</div>
              <p>Earned certificates</p>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="recent-activity">
          <mat-card-header>
            <mat-card-title>Recent Activity</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Your recent learning activities will appear here.</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
    styles: [`
    .dashboard-container {
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .logo {
      font-size: 20px;
      font-weight: 600;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .dashboard-content {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 32px;
      color: #333;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      text-align: center;
    }

    .stat-value {
      font-size: 48px;
      font-weight: 700;
      color: #667eea;
      margin: 16px 0;
    }

    .recent-activity {
      margin-top: 24px;
    }
  `]
})
export class DashboardComponent implements OnInit {
    currentUser: User | null = null;

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
        });
    }

    logout(): void {
        this.authService.logout().subscribe();
    }
}
