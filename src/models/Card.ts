export interface Card {
  Deleted: boolean;
  Id: string;
  Official: boolean;
  AuthorId?: string;
  Attack?: string;
  Classification: string;
  Cost: string;
  Health?: string;
  Name: string;
  Printings: Printing[];
  Resource?: string;
  Rules?: string;
  Subname: string;
  Thwart?: string;
  Traits: string[];
  Type: string;
  Unique: boolean;
  ImageUrl: string;
  /** Set only for double-sided cards that ship a distinct back image (Merlin). */
  BackImageUrl?: string;
}

interface Printing {
  ArtificialId: string;
  PackId: string;
  PackNumber: string;
  Flavor?: string;
  SetNumber: string;
  SetId: string;
  UniqueArt: boolean;
}