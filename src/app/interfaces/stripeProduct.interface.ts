export interface StripeResponse {
    object: string
    data: [productsStripe]
    has_more: boolean
    url: string
  }
  
  export interface productsStripe {
    id: string
    object: string
    active: boolean
    attributes: any[]
    created: number
    default_price: string
    description: string
    features: Feature[]
    images: string[]
    livemode: boolean
    metadata: string[]
    name: string
    package_dimensions: any
    shippable: any
    statement_descriptor: string
    tax_code: any
    type: string
    unit_label: any
    updated: number
    url: any
  }
  
  export interface Feature {
    name: string
  }
