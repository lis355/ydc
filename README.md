# ydc
NodeJS application local config downloader from Yandex.Disk

I like to store some important data (tokens, credentials, etc.) for application start in `.env.local` (or `.env.development`, `.env.production`) files, which override default settings in `.env` file. 
But these files are staying on server, and all of it are in different places. What would be, if all confings of my running apps will be in one place?
And, if I lost my connection to server, these important files will be there. 
I think, it will be nice, if application will load confing at start by some url, or hash, and I can control acess to this confing from one place.

Okay. This library found local file `.ydc`, where your application is started, read it and tried to download listed confings in this file

```javascript
import ydc from "ydc";

await ydc();

console.log(process.env.MY_TOKEN);
```

`.ydc` file contents - each line links to .env file, which will be downloaded and loaded to `process.env`
```
https://disk.yandex.ru/d/QwErfdss123
```

`.env` file contents on Yandex.Disk service
```
MY_TOKEN=QWERTY
```
