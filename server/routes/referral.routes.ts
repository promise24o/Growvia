import "reflect-metadata";
import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { Get } from "../decorators/route";
import { getReferrals } from "../controllers";

export class ReferralController {
  @Get("/", [authenticate])
  async getReferrals(req: Request, res: Response) {
    return getReferrals(req, res);
  }
}

const router = Router();
const referralController = new ReferralController();

const methods = Object.getOwnPropertyNames(ReferralController.prototype).filter(
  (prop) => prop !== "constructor"
);
methods.forEach((method) => {
  const routeMetadata = Reflect.getMetadata("route", referralController[method as keyof ReferralController]);
  if (routeMetadata) {
    const { method: httpMethod, path, middleware } = routeMetadata;
    switch (httpMethod.toUpperCase()) {
      case "GET":
        router.get(path, ...middleware, referralController[method as keyof ReferralController].bind(referralController));
        break;
      default:
        console.warn(`Unsupported HTTP method: ${httpMethod}`);
    }
  }
});

export default router;