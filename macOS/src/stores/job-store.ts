import { create } from "zustand"

type JobStore = {
  jobPosition: string
  setJobPosition: (p: string) => void
}

export const useJobStore = create<JobStore>((set) => ({
  jobPosition: "",
  setJobPosition: (jobPosition) => set({ jobPosition }),
}))
