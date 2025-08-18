import { ProductController } from "../controllers/products-controllers";
import { Router } from "express";

const productsRoutes = Router();
const productsControllerr = new ProductController();

productsRoutes.get("/", productsControllerr.index);

export { productsRoutes };
