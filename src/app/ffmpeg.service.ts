import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FfmpegService {

  constructor(
    private http: HttpClient
  ) { }

  simpleGet(url: string): Observable<any> {
    return this.http.get(url,
      { responseType: 'text' }
    )
  }
}
