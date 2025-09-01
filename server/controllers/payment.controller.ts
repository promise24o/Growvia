import { Request, Response } from "express";
import { initializePayment } from "../services/payment.service";

export const createPayment = async (req: Request, res: Response) => {
  try {
    const result = await initializePayment(req.body);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

