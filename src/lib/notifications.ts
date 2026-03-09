import Swal from "sweetalert2";

export const showToast = (
  icon: "success" | "error" | "warning" | "info",
  title: string,
) => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: "#121212",
    color: "#fff",
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
  Toast.fire({ icon, title });
};

export const showAlert = (
  icon: "success" | "error" | "warning",
  title: string,
  text: string,
) => {
  return Swal.fire({
    icon,
    title,
    text,
    background: "#121212",
    color: "#fff",
    confirmButtonColor: "#ea580c",
    customClass: {
      popup: "rounded-3xl border border-border/50 backdrop-blur-xl",
    },
  });
};
