import { Component, OnInit } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, /*fetchFile, downloadWithProgress*/ } from '@ffmpeg/util';
import { FfmpegService } from './ffmpeg.service';
declare let FFmpegWASM: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'ffmpeg-ng-16';

  ngOnInit(): void {
    this.loadFfmpef();
  }

  constructor(
    private videoSvc: FfmpegService
  ) {
  }

  loaded = false;
  ffmpegRef = new FFmpeg();
  transcodeLog = null;
  messageRef = '';
  progressMsg = '';
  progressValue = 0;
  showProgress = false;

  wasmProgress = 0;
  wasmProgressMsg = '';

  async loadFfmpef() {
    this.showProgress = true;
    //It should be like this, until this is merged: https://github.com/ffmpegwasm/ffmpeg.wasm/pull/562
    //Thanks this guy: https://github.com/ffmpegwasm/ffmpeg.wasm/issues/548#issuecomment-1707248897
    const baseURLFFMPEG = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd'
    // const ffmpegBlobURL = await this.videoSvc.toBlobURLPatched(`${baseURLFFMPEG}/ffmpeg.js`, 'text/javascript', (js: any) => {
    //   return js.replace('new URL(e.p+e.u(814),e.b)', 'r.worker814URL');
    // });
    let ffmpegBlobURL;
    this.videoSvc.simpleGet(`https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js`)
      .subscribe(async (js: any) => {
        const newJs = js.replace('new URL(e.p+e.u(814),e.b)', 'r.worker814URL');
        const blob = new Blob([newJs], { type: 'text/javascript' });
        ffmpegBlobURL = URL.createObjectURL(blob);

        import(ffmpegBlobURL).then((module) => {
          console.log('module',module)
        })
          .catch((error) => {
            console.error('Error:', error);
          });

        const baseURLCore = 'https://unpkg.com/@ffmpeg/core@0.12.3/dist/umd'
        // const baseURLCore = 'http://localhost:3000/ffmpeg'
        const config = {
          worker814URL: await toBlobURL(`${baseURLFFMPEG}/814.ffmpeg.js`, 'text/javascript', true),
          coreURL: await toBlobURL(`${baseURLCore}/ffmpeg-core.js`, 'text/javascript', true),
          wasmURL: await toBlobURL(`${baseURLCore}/ffmpeg-core.wasm`, 'application/wasm', true),
        };

        this.ffmpegRef = new FFmpegWASM.FFmpeg();
        this.ffmpegRef.on('log', ({ message }) => {
          console.log(message);
          this.messageRef = message
        });
        this.ffmpegRef.on('progress', ({ progress, time }) => {
          this.showProgress = progress != 1;
          console.log('progress', progress, time);
          this.progressValue = Math.ceil(progress * 100);
          this.progressMsg = `${this.progressValue} % (transcoded time: ${time / 1000000} s)`;
        });
        await this.ffmpegRef.load(config);
        console.log('ffmpeg.load success');
        this.loaded = true;
        this.showProgress = false;
      })
  }

}
