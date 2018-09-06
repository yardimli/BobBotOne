const raspi = require('raspi');
const I2C = require('raspi-i2c').I2C;

raspi.init(() => {
  const i2c = new I2C();
  console.log(i2c.readByteSync(0x10)); // Read one byte from the device at address 18

  let buf = new Buffer.alloc(32);

  buf[0] = (buf[0] & (0xe6)) | (0x01 << 3);
  buf[1] = 2;//color;
  buf[2] = 1;//x;
  buf[3] = 1;//y;

//  console.log(buf);

  i2c.writeSync(0x10,0x02,buf);


  buf[0] = (buf[0] & (0xe6)) | (0x02 << 3);
  buf[1] = 4;//color;
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