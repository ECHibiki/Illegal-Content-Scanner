# Illegal-Content-Scanner
Scanner for illegal content on vichan based imageboards<br/>
## The General Idea
The concept here is to create an AI bot which can read images and posts on imageboards, then send out notificaitons and perform actions if content is illegal. This is targetting "for proffit" spammers who use imageboards to post CSAM content and intend for people to pay for it.
This is different from CSAM spam which intends to shut down websites through complaints to registrars or providers. It is a means to target people spamming for money.<br/>
It's javascript because I'm too lazy to setup a ts and webpack build. Requires an outside server using OCR and a disposable webserver hosting it(will be experimenting with shared hosting on A2Hosting( https://www.a2hosting.com/web-hosting/) 
since they seem to offer a good and cheap NodeJS solution for some lightweight webscraping ). Is designed for vichan imageboards but with little effort can retarget other platforms.
## Imageboard
Uses vichan but others possible
## Hosting
Designed to run on shared hosting
## OCR
Will add details of how kissu approaches OCR for reaiding watermarked images. Some current ideas are https://github.com/PaddlePaddle/PaddleOCR and https://github.com/zhang0jhon/AttentionOCR which are high quality
scene text recognition solutions. 
