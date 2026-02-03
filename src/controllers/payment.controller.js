const PaymentService = require("../services/payment.service");
const mongoose = require("mongoose")

class PaymentController {

  constructor(eventBus, vnpayGateway) {
    this.paymentService = new PaymentService(eventBus, vnpayGateway);
  }

  // [POST] /api/v1/payments
  create = async (req, res) => {
    const result = await this.paymentService.createPayment({
      userId: req.user.userId,
      subscriptionId: req.body.subscriptionId,
      planId: req.body.planId,
      ipAddr: req.ip
    });
    res.json(result);
  };

  // [GET] /api/v1/payments/vnpay/ipn
  ipn = async (req, res) => {
    await this.paymentService.handleIPN(req.query);
    res.json({ message: "OK" });
  };

  // [GET] /api/v1/payments/:ref
  getStatus = async (req, res) => {
    const payment = await this.paymentService.getPaymentStatus(req.params.ref);
    res.json(payment);
  };

  // [GET] /api/v1/payments/vnpay/return
  vnpayReturn = async (req, res) => {
    res.send(`<html><body><h1>Payment Successful</h1><p>Your payment has been processed successfully. You can close this window.</p></body></html>`);
  }

};

module.exports = PaymentController;
