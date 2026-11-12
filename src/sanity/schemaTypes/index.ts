import product from './product';
import category from './category';
import print from './print';
import coupon from './coupon';
import review from "./review";
import order from './order';
import event from './event';
import rsvp from './rsvp';
import sharedList from './sharedList';
import { marketingLog, marketingOptOut, marketingSettings, stockAlert } from './marketing';
import abandonedCart from './abandonedCart';

export const schemaTypes = [product, category, print, coupon, review, order, event, rsvp, sharedList, marketingSettings, stockAlert, marketingLog, marketingOptOut, abandonedCart];