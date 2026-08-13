import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { previewDoiMetadata } from "@/services/integration.service";

export const useDoiPreview = () => {
  return useMutation({
    mutationFn: (doi: string) => previewDoiMetadata(doi),
    onSuccess: (data) => {
      toast.success(`DOI Resolved via ${data.metadata.sourceApi}`, {
        description: `Retrieved "${data.metadata.title}" (${data.metadata.publicationYear})`,
      });
    },
    onError: (err: any) => {
      toast.error("DOI Resolution Failed", {
        description: err.response?.data?.message || err.message || "Unable to fetch DOI metadata.",
      });
    },
  });
};
