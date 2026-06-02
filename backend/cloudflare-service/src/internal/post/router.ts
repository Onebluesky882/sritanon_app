import { Hono } from "hono";

import * as controller from "./controller";
import { Bindings } from "@/db/types";





export const router = new Hono<{ Bindings: Bindings }>();

router.get("/", controller.list);
router.post("/", controller.create);
router.put("/:id", controller.update);