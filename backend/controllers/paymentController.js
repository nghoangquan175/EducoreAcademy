const { PaymentOrder, Payment } = require('../models');
const vnpayConfig = require('../config/vnpay');
const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment');

exports.createOrder = async (req, res) => {
  try {
    const { courseId, amount } = req.body;
    const userId = req.user.id;

    const order = await PaymentOrder.create({
      userId,
      courseId,
      amount,
      status: 'pending'
    });

    res.status(201).json({ orderId: order.id });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    const { orderId, amount, bankCode } = req.body;

    const order = await PaymentOrder.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');

    const ipAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = vnpayConfig.vnp_TmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = vnpayConfig.vnp_ReturnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    if (bankCode !== null && bankCode !== '' && bankCode !== undefined) {
      vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;

    const paymentUrl = vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

    await Payment.create({
      orderId: orderId,
      status: 'pending'
    });

    res.status(200).json({ paymentUrl });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];

      const clientUrl = process.env.CLIENT_URL || 'https://localhost:5173';
      return res.redirect(`${clientUrl}/payment-result?status=${responseCode === '00' ? 'success' : 'failed'}&orderId=${orderId}`);
    } else {
      const clientUrl = process.env.CLIENT_URL || 'https://localhost:5173';
      return res.redirect(`${clientUrl}/payment-result?status=failed&orderId=invalid`);
    }
  } catch (error) {
    console.error('VNPay return error exception:');
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.vnpayIpn = async (req, res) => {
  try {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    let orderId = vnp_Params['vnp_TxnRef'];
    let rspCode = vnp_Params['vnp_ResponseCode'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    const order = await PaymentOrder.findByPk(orderId);

    if (secureHash === signed) {
      if (order) {
        if (order.amount * 100 == vnp_Params['vnp_Amount']) {
          if (order.status === 'pending') {
            if (rspCode === "00") {
              order.status = 'paid';
              await order.save();

              await Payment.create({
                orderId: orderId,
                transactionCode: vnp_Params['vnp_TransactionNo'],
                status: 'success',
                rawResponse: JSON.stringify(vnp_Params)
              });

              res.status(200).json({ RspCode: '00', Message: 'Success' });
            } else {
              order.status = 'failed';
              await order.save();

              await Payment.create({
                orderId: orderId,
                transactionCode: vnp_Params['vnp_TransactionNo'],
                status: 'failed',
                rawResponse: JSON.stringify(vnp_Params)
              });

              res.status(200).json({ RspCode: '00', Message: 'Success' });
            }
          } else {
            res.status(200).json({ RspCode: '02', Message: 'This order has been updated to the payment status' });
          }
        } else {
          res.status(200).json({ RspCode: '04', Message: 'Amount invalid' });
        }
      } else {
        res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }
    } else {
      res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
    }
  } catch (error) {
    console.error('VNPay IPN error:', error);
    res.status(500).json({ RspCode: '99', Message: 'Unknow error' });
  }
};

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[decodeURIComponent(str[key])]).replace(/%20/g, "+");
  }
  return sorted;
}
