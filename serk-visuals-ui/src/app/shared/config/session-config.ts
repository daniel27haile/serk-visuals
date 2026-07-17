import { SessionType } from '../models/booking.model';

export type FieldType = 'select' | 'radio' | 'checkbox-group' | 'textarea' | 'text';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: SelectOption[];
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

export type PricingStrategy = 'hourly' | 'package' | 'starting' | 'dynamic';

export interface PackageOption {
  value: string;
  label: string;
  price: number;
  /** Duration in minutes for this package — drives availability check and schedule card. */
  durationMinutes?: number;
}

export interface SessionPricing {
  strategy: PricingStrategy;
  hourlyRate?: number;
  startingPrice?: number;
  startingLabel?: string;
  packages?: PackageOption[];
}

export interface SessionConfig {
  label: string;
  pricing: SessionPricing;
  fields: FieldConfig[];
  /** Keys from bookingDetails to show in the BookingSummary component. */
  summaryFields: string[];
}

export const SESSION_CONFIGS: Record<SessionType, SessionConfig> = {

  Portrait: {
    label: 'Portrait Session',
    pricing: { strategy: 'hourly', hourlyRate: 150 },
    fields: [
      {
        key: 'groupSize',
        label: 'Group Size',
        type: 'radio',
        options: [
          { value: '1 person',    label: '1 person'    },
          { value: '2 people',    label: '2 people'    },
          { value: '3–5 people',  label: '3–5 people'  },
          { value: '6+ people',   label: '6+ people'   },
        ],
      },
    ],
    summaryFields: ['groupSize'],
  },

  Family: {
    label: 'Family Session',
    pricing: { strategy: 'hourly', hourlyRate: 200 },
    fields: [
      {
        key: 'groupSize',
        label: 'Group Size',
        type: 'radio',
        options: [
          { value: '2–4 people',  label: '2–4 people'  },
          { value: '5–8 people',  label: '5–8 people'  },
          { value: '9–12 people', label: '9–12 people' },
          { value: '12+ people',  label: '12+ people'  },
        ],
      },
    ],
    summaryFields: ['groupSize'],
  },

  Graduation: {
    label: 'Graduation Session',
    pricing: { strategy: 'hourly', hourlyRate: 150 },
    fields: [
      {
        key: 'graduateCount',
        label: 'Number of Graduates',
        type: 'radio',
        options: [
          { value: '1 Graduate',     label: '1 Graduate'     },
          { value: '2 Graduates',    label: '2 Graduates'    },
          { value: 'Group Session',  label: 'Group Session'  },
        ],
      },
    ],
    summaryFields: ['graduateCount'],
  },

  Engagement: {
    label: 'Engagement Session',
    pricing: { strategy: 'hourly', hourlyRate: 200 },
    fields: [
      {
        key: 'coupleType',
        label: 'Session Type',
        type: 'radio',
        options: [
          { value: 'Couple',              label: 'Couple'              },
          { value: 'Couple + Family',     label: 'Couple + Family'     },
          { value: 'Surprise Proposal',   label: 'Surprise Proposal'   },
        ],
      },
    ],
    summaryFields: ['coupleType'],
  },

  Wedding: {
    label: 'Wedding Photography',
    pricing: {
      strategy: 'package',
      packages: [
        { value: 'Ceremony Only',        label: 'Ceremony Only',        price: 400,  durationMinutes: 120 },
        { value: 'Half Day',             label: 'Half Day (4 hrs)',     price: 700,  durationMinutes: 240 },
        { value: 'Full Day',             label: 'Full Day (8 hrs)',     price: 1200, durationMinutes: 480 },
        { value: 'Full Wedding Package', label: 'Full Wedding Package', price: 2000, durationMinutes: 600 },
      ],
    },
    fields: [
      {
        key: 'weddingPackage',
        label: 'Wedding Package',
        type: 'radio',
        required: true,
        options: [
          { value: 'Ceremony Only',        label: 'Ceremony Only — $400'         },
          { value: 'Half Day',             label: 'Half Day (4 hrs) — $700'      },
          { value: 'Full Day',             label: 'Full Day (8 hrs) — $1,200'    },
          { value: 'Full Wedding Package', label: 'Full Wedding Package — $2,000' },
        ],
      },
      {
        key: 'guestCount',
        label: 'Estimated Guest Count',
        type: 'select',
        options: [
          { value: '',      label: 'Select a range'  },
          { value: '1–50',  label: '1–50 guests'     },
          { value: '51–100', label: '51–100 guests'  },
          { value: '101–200', label: '101–200 guests' },
          { value: '201–300', label: '201–300 guests' },
          { value: '300+',  label: '300+ guests'     },
        ],
      },
      {
        key: 'needSecondPhotographer',
        label: 'Second Photographer',
        type: 'radio',
        options: [
          { value: 'No',  label: 'No, not needed'       },
          { value: 'Yes', label: 'Yes, please add one'  },
        ],
      },
    ],
    summaryFields: ['weddingPackage', 'guestCount', 'needSecondPhotographer'],
  },

  Event: {
    label: 'Event Coverage',
    pricing: { strategy: 'hourly', hourlyRate: 200 },
    fields: [
      {
        key: 'expectedAttendance',
        label: 'Expected Attendance',
        type: 'select',
        options: [
          { value: '',       label: 'Select a range'  },
          { value: '1–50',   label: '1–50 people'     },
          { value: '50–100', label: '50–100 people'   },
          { value: '100–250', label: '100–250 people' },
          { value: '250+',   label: '250+ people'     },
        ],
      },
      {
        key: 'venueType',
        label: 'Venue Type',
        type: 'radio',
        options: [
          { value: 'Indoor',  label: 'Indoor'  },
          { value: 'Outdoor', label: 'Outdoor' },
          { value: 'Both',    label: 'Both'    },
        ],
      },
    ],
    summaryFields: ['expectedAttendance', 'venueType'],
  },

  'Real Estate': {
    label: 'Real Estate Photography',
    pricing: { strategy: 'dynamic' },
    fields: [
      {
        key: 'propertyType',
        label: 'Property Type',
        type: 'select',
        required: true,
        options: [
          { value: '',                 label: 'Select type'       },
          { value: 'House',            label: 'House'             },
          { value: 'Condo',            label: 'Condo'             },
          { value: 'Apartment',        label: 'Apartment'         },
          { value: 'Townhouse',        label: 'Townhouse'         },
          { value: 'Commercial Space', label: 'Commercial Space'  },
          { value: 'Other',            label: 'Other'             },
        ],
      },
      {
        key: 'propertySize',
        label: 'Bedrooms / Unit Size',
        type: 'select',
        required: true,
        options: [
          { value: '',              label: 'Select size'    },
          { value: 'Studio',        label: 'Studio'         },
          { value: '1 Bedroom',     label: '1 Bedroom'      },
          { value: '2 Bedrooms',    label: '2 Bedrooms'     },
          { value: '3 Bedrooms',    label: '3 Bedrooms'     },
          { value: '4+ Bedrooms',   label: '4+ Bedrooms'    },
          { value: '5,000+ sq ft',  label: '5,000+ sq ft'   },
        ],
      },
      {
        key: 'squareFt',
        label: 'Approximate Square Footage',
        type: 'select',
        options: [
          { value: '',            label: 'Select range'        },
          { value: 'Under 1,000', label: 'Under 1,000 sq ft'  },
          { value: '1,000–1,499', label: '1,000–1,499 sq ft'  },
          { value: '1,500–1,999', label: '1,500–1,999 sq ft'  },
          { value: '2,000–2,999', label: '2,000–2,999 sq ft'  },
          { value: '3,000–4,999', label: '3,000–4,999 sq ft'  },
          { value: '5,000+',      label: '5,000+ sq ft'        },
        ],
      },
      {
        key: 'bathrooms',
        label: 'Number of Bathrooms',
        type: 'select',
        options: [
          { value: '',    label: 'Select count' },
          { value: '1',   label: '1'            },
          { value: '1.5', label: '1.5'          },
          { value: '2',   label: '2'            },
          { value: '2.5', label: '2.5'          },
          { value: '3',   label: '3'            },
          { value: '3.5+',label: '3.5+'         },
        ],
      },
      {
        key: 'services',
        label: 'Photography Services',
        type: 'checkbox-group',
        required: true,
        options: [
          { value: 'Interior Photography', label: 'Interior Photography' },
          { value: 'Exterior Photography', label: 'Exterior Photography' },
          { value: 'Drone Footage',        label: 'Drone Photography'    },
          { value: 'Twilight Shoot',       label: 'Twilight Shoot'       },
          { value: 'Walkthrough Video',    label: 'Walkthrough Video'    },
          { value: 'Floor Plan',           label: 'Floor Plan'           },
          { value: 'Virtual Tour',         label: 'Virtual Tour'         },
        ],
      },
      {
        key: 'accessInstructions',
        label: 'Access Instructions',
        type: 'textarea',
        placeholder: 'Lock box code, gate code, building entry details, contact person on-site…',
        rows: 3,
      },
      {
        key: 'agentNotes',
        label: 'Agent / Realtor Notes',
        type: 'textarea',
        placeholder: 'Staging info, features to highlight, shooting priorities, special requests…',
        rows: 3,
      },
    ],
    summaryFields: ['propertyType', 'propertySize', 'squareFt', 'services'],
  },

  Commercial: {
    label: 'Commercial / Branding',
    pricing: { strategy: 'starting', startingPrice: 300, startingLabel: 'Starting at' },
    fields: [
      {
        key: 'projectType',
        label: 'Project Type',
        type: 'select',
        options: [
          { value: '',                    label: 'Select type'             },
          { value: 'Business Branding',   label: 'Business Branding'       },
          { value: 'Personal Branding',   label: 'Personal Branding'       },
          { value: 'Product Photography', label: 'Product Photography'     },
          { value: 'Corporate Headshots', label: 'Corporate Headshots'     },
          { value: 'Social Media Content', label: 'Social Media Content'   },
          { value: 'Other',               label: 'Other'                   },
        ],
      },
      {
        key: 'deliverables',
        label: 'Number of Deliverables',
        type: 'select',
        options: [
          { value: '',           label: 'Select deliverables' },
          { value: '10 images',  label: '10 images'           },
          { value: '20 images',  label: '20 images'           },
          { value: '50 images',  label: '50 images'           },
          { value: '100+ images', label: '100+ images'        },
        ],
      },
      {
        key: 'businessName',
        label: 'Business / Brand Name (optional)',
        type: 'text',
        placeholder: 'Your business or brand name',
      },
    ],
    summaryFields: ['projectType', 'deliverables'],
  },

  Birthday: {
    label: 'Birthday Session',
    pricing: { strategy: 'hourly', hourlyRate: 175 },
    fields: [
      {
        key: 'groupSize',
        label: 'Group Size',
        type: 'radio',
        options: [
          { value: '1 person',    label: '1 person'    },
          { value: '2–5 people',  label: '2–5 people'  },
          { value: '6–15 people', label: '6–15 people' },
          { value: '16+ people',  label: '16+ people'  },
        ],
      },
    ],
    summaryFields: ['groupSize'],
  },

  Product: {
    label: 'Product Photography',
    pricing: { strategy: 'dynamic' },
    fields: [
      {
        key: 'productType',
        label: 'Product Category',
        type: 'select',
        required: true,
        options: [
          { value: '',                       label: 'Select category'         },
          { value: 'Food & Beverage',        label: 'Food & Beverage'         },
          { value: 'Clothing & Accessories', label: 'Clothing & Accessories'  },
          { value: 'Electronics',            label: 'Electronics'             },
          { value: 'Cosmetics',              label: 'Cosmetics'               },
          { value: 'Jewelry',                label: 'Jewelry'                 },
          { value: 'Other',                  label: 'Other'                   },
        ],
      },
      {
        key: 'deliverables',
        label: 'Number of Deliverables',
        type: 'select',
        required: true,
        options: [
          { value: '',            label: 'Select deliverables' },
          { value: '5–10 images', label: '5–10 images'        },
          { value: '15–25 images', label: '15–25 images'      },
          { value: '30–50 images', label: '30–50 images'      },
          { value: '50+ images',  label: '50+ images'         },
        ],
      },
    ],
    summaryFields: ['productType', 'deliverables'],
  },

  Personal: {
    label: 'Personal Session',
    pricing: { strategy: 'hourly', hourlyRate: 150 },
    fields: [],
    summaryFields: [],
  },

  Other: {
    label: 'Other',
    pricing: { strategy: 'starting', startingPrice: 175, startingLabel: 'Starting at' },
    fields: [
      {
        key: 'projectDescription',
        label: 'Project Description',
        type: 'textarea',
        required: true,
        placeholder: 'Describe your project, what you need photographed, any special requirements…',
        rows: 4,
      },
    ],
    summaryFields: ['projectDescription'],
  },

};
