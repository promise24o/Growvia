import "reflect-metadata";
import { RequestHandler } from "express";

export function Get(path: string, middleware: RequestHandler[] = []) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", { method: "GET", path, middleware }, descriptor.value);
  };
}

export function Post(path: string, middleware: RequestHandler[] = []) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", { method: "POST", path, middleware }, descriptor.value);
  };
}

export function Put(path: string, middleware: RequestHandler[] = []) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata("route", { method: "PUT", path, middleware }, descriptor.value);
  };
}