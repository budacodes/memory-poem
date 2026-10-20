import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

interface IpResponse {
  ip: string;
}

interface RegisteredIp {
  address: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);

  private readonly ipApiUrl = 'https://api.ipify.org?format=json';

  private readonly firebaseUrl = 'https://memory-poem-default-rtdb.firebaseio.com/ips.json';

  ip = '';
  isLoading = signal<boolean>(true);
  doesCurrentIpExist = false;
  errorMessage = '';

  ngOnInit(): void {
    this.checkExistingIp();
  }

  checkExistingIp(): void {
    this.isLoading.set(true);
    this.errorMessage = '';

    this.http.get<IpResponse>(this.ipApiUrl).subscribe({
      next: (response) => {
        this.ip = response.ip;

        console.log(this.ip);

        this.checkFirebase();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage = 'Não foi possível consultar seu IP.';
      },
    });
  }

  private checkFirebase(): void {
    this.http.get<Record<string, RegisteredIp> | null>(this.firebaseUrl).subscribe({
      next: (response) => {
        const existingIps = Object.values(response ?? {});

        this.doesCurrentIpExist = existingIps.some(
          (registeredIp) => registeredIp.address === this.ip,
        );

        if (this.doesCurrentIpExist) {
          this.isLoading.set(false);
          return;
        }

        this.saveClientIp();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage = 'Não foi possível consultar o cadastro.';
      },
    });
  }

  private saveClientIp(): void {
    const newIp: RegisteredIp = {
      address: this.ip,
    };

    this.http.post(this.firebaseUrl, newIp).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage = 'Não foi possível registrar seu acesso.';
      },
    });
  }
}
