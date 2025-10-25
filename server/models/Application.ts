import mongoose, { Document, Schema } from "mongoose";
import { AppCategory, AppStatus, AppType } from "../../shared/schema";

export interface ILandingPage {
  id: string;
  title: string;
  url: string;
  isPrimary: boolean;
  createdAt: Date;
}

export interface IPromoMaterial {
  id: number;
  name: string;
  type: string;
  url: string;
  size: string;
  dimensions: string;
  uploadedAt: Date;
}

export interface IApp extends Document {
  _id: string;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  type: AppType;
  url: string;
  shortDescription: string;
  detailedDescription?: string;
  category: AppCategory;
  appStoreLink?: string;
  googlePlayLink?: string;
  landingPages?: ILandingPage[];
  icon?: string;
  promoMaterials?: IPromoMaterial[];
  status: AppStatus;
  createdAt: Date;
  updatedAt: Date;
}

const allowedTypes = ['Mobile App', 'Website'];
const allowedCategories = ['Finance', 'eCommerce', 'Education', 'Health', 'Gaming', 'Social', 'Productivity', 'Other'];
const allowedStatuses = ['active', 'inactive', 'draft'];

const AppSchema = new Schema<IApp>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Name must be less than 100 characters'],
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: allowedTypes,
        message: 'Invalid application type',
      },
    },
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => /^https?:\/\/.+/.test(value),
        message: 'Invalid URL format',
      },
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Short description must be less than 200 characters'],
    },
    detailedDescription: {
      type: String,
      trim: true,
      maxlength: [1000, 'Detailed description must be less than 1000 characters'],
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: allowedCategories,
        message: 'Invalid category',
      },
    },
    appStoreLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (value: string) {
          return this.type !== 'Mobile App' || /^https?:\/\/.+/.test(value);
        },
        message: 'Invalid App Store URL',
      },
    },
    googlePlayLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (value: string) {
          return this.type !== 'Mobile App' || /^https?:\/\/.+/.test(value);
        },
        message: 'Invalid Google Play URL',
      },
    },
    landingPages: {
      type: [{
        id: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        url: {
          type: String,
          required: true,
          trim: true,
          validate: {
            validator: (value: string) => /^https?:\/\/.+/.test(value),
            message: 'Invalid URL format',
          },
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      }],
      validate: {
        validator: function (value: ILandingPage[]) {
          if (this.type === 'Website') {
            return value && value.length > 0;
          }
          return true;
        },
        message: 'At least one landing page is required for Website',
      },
    },
    icon: {
      type: String,
      trim: true,
      default: null,
    },
    promoMaterials: {
      type: [{
        id: {
          type: Number,
          required: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
          trim: true,
        },
        size: {
          type: String,
          required: true,
        },
        dimensions: {
          type: String,
          default: 'N/A',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      }],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(AppStatus),
        message: 'Invalid status',
      },
      default: AppStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

AppSchema.index({ organizationId: 1, createdAt: -1 });
AppSchema.index({ type: 1 });
AppSchema.index({ category: 1 });
AppSchema.index({ status: 1 });

export const App = mongoose.model<IApp>('App', AppSchema);
export const AppTypes = allowedTypes;
export const AppCategories = allowedCategories;
export const AppStatuses = Object.values(AppStatus);