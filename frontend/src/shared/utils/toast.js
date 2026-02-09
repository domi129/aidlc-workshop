import { toast } from 'react-toastify';

class ToastService {
  static success(message, options = {}) {
    toast.success(message, {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  static error(message, options = {}) {
    toast.error(message, {
      position: 'top-center',
      autoClose: 3000,
      ...options
    });
  }

  static info(message, options = {}) {
    toast.info(message, {
      position: 'top-center',
      autoClose: 3000,
      ...options
    });
  }
}

export default ToastService;
