import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AddPropertyLocation = {
  label: string;
  latitude: number;
  longitude: number;
} | null;

export type AddPropertyFormValues = {
  categoryId: string;
  subcategoryId: string;
  propertyTitle: string;
  description: string;
  price: string;
  isNegotiable: boolean;
  totalFloor: string;
  propertyFloorNo: string;
  totalAreaSqft: string;
  carpetAreaSqft: string;
  landlordPhone: string;
  amenityIds: string[];
};

interface AddPropertyState {
  currentStep: number;
  formValues: AddPropertyFormValues;
  locationMode: "existing" | "search";
  selectedAddressId: string | null;
  prefilledLocation: AddPropertyLocation;
  existingPhotoUrls: string[];
  
  // Actions
  setStep: (step: number) => void;
  updateForm: (values: Partial<AddPropertyFormValues>) => void;
  setLocationMode: (mode: "existing" | "search") => void;
  setSelectedAddressId: (id: string | null) => void;
  setPrefilledLocation: (loc: AddPropertyLocation | ((prev: AddPropertyLocation) => AddPropertyLocation)) => void;
  setExistingPhotoUrls: (urls: string[] | ((prev: string[]) => string[])) => void;
  resetStore: () => void;
}

const DEFAULT_FORM_VALUES: AddPropertyFormValues = {
  categoryId: "",
  subcategoryId: "",
  propertyTitle: "",
  description: "",
  price: "",
  isNegotiable: true,
  totalFloor: "",
  propertyFloorNo: "",
  totalAreaSqft: "",
  carpetAreaSqft: "",
  landlordPhone: "",
  amenityIds: [],
};

export const useAddPropertyStore = create<AddPropertyState>()(
  persist(
    (set) => ({
      currentStep: 1,
      formValues: DEFAULT_FORM_VALUES,
      locationMode: "existing",
      selectedAddressId: null,
      prefilledLocation: null,
      existingPhotoUrls: [],

      setStep: (currentStep) => set({ currentStep }),
      updateForm: (values) =>
        set((state) => {
          // Optimization: Only update if values actually changed to prevent loops
          const hasChanged = Object.entries(values).some(
            ([key, val]) => state.formValues[key as keyof AddPropertyFormValues] !== val
          );
          if (!hasChanged) return state;
          
          return {
            formValues: { ...state.formValues, ...values },
          };
        }),
      setLocationMode: (locationMode) => set({ locationMode }),
      setSelectedAddressId: (selectedAddressId) => set({ selectedAddressId }),
      setPrefilledLocation: (loc) => 
        set((state) => ({ 
          prefilledLocation: typeof loc === "function" ? loc(state.prefilledLocation) : loc 
        })),
      setExistingPhotoUrls: (urls) => 
        set((state) => ({ 
          existingPhotoUrls: typeof urls === "function" ? urls(state.existingPhotoUrls) : urls 
        })),
      resetStore: () =>
        set({
          currentStep: 1,
          formValues: DEFAULT_FORM_VALUES,
          locationMode: "existing",
          selectedAddressId: null,
          prefilledLocation: null,
          existingPhotoUrls: [],
        }),
    }),
    {
      name: "nhyvas-add-property-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
