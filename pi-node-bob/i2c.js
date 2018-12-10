const raspi = require('raspi');
const I2C = require('raspi-i2c').I2C;

raspi.init(() => {

  const servo_i2c = new I2C();
  console.log(servo_i2c.readByteSync(0x6F));


  const i2c = new I2C();
  console.log(i2c.readByteSync(0x10)); // Read one byte from the device at address 18

  let buf = new Buffer.alloc(32);

  buf[0] = (buf[0] & (0xe6)) | (0x01 << 3);
  buf[1] = 2;//color;
  buf[2] = 1;//x;
  buf[3] = 1;//y;

//  console.log(buf);

  i2c.writeSync(0x10,0x02,buf);

  setInterval( function () {

    var faceID = Math.floor(Math.random() * Math.floor(22));
    var colorID = Math.floor(Math.random() * Math.floor(6));
    buf[0] = (buf[0] & (0xe6)) | (0x02 << 3);
    buf[1] = colorID;//color;
    buf[2] = 3;//x;
    buf[3] = 1;//y;
    buf[4] = faceID;//y;
    console.log(faceID+" "+colorID);

    i2c.writeSync(0x10,0x02,buf);
  },2000);

  buf[0] = (buf[0] & (0xe6)) | (0x02 << 3);
  buf[1] = 3;//color;
  buf[2] = 3;//x;
  buf[3] = 1;//y;
  buf[4] = 17;//y;

//  console.log(buf);

  i2c.writeSync(0x10,0x02,buf);

//  i2c.writeByteSync(0x10,0x02, 8 );
//  i2c.writeByteSync(0x10,0x02, 2 );
//  i2c.writeByteSync(0x10,0x02, 1 );
//  i2c.writeByteSync(0x10,0x02, 1 );
});