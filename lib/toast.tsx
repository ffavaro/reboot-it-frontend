import { toast, type ToastOptions } from "react-toastify"

const defaults: ToastOptions = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
}

export const showToast = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, { ...defaults, ...options }),

  error: (message: string, options?: ToastOptions) =>
    toast.error(message, { ...defaults, autoClose: 6000, ...options }),

  warning: (message: string, options?: ToastOptions) =>
    toast.warning(message, { ...defaults, ...options }),

  info: (message: string, options?: ToastOptions) =>
    toast.info(message, { ...defaults, ...options }),

  loading: (message: string, options?: ToastOptions) =>
    toast.loading(message, { ...defaults, autoClose: false, ...options }),

  dismiss: (id?: ReturnType<typeof toast>) => toast.dismiss(id),
}
