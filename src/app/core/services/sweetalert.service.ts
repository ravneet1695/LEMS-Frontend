import Swal from 'sweetalert2';

export class SweetAlertService {
    static async confirm(
        title: string,
        text: string = '',
        confirmButtonText: string = 'Yes',
        cancelButtonText: string = 'Cancel'
    ): Promise<boolean> {
        const result = await Swal.fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText,
            cancelButtonText
        });
        return result.isConfirmed;
    }

    static success(title: string, text: string = ''): void {
        Swal.fire({
            title,
            text,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
        });
    }

    static error(title: string, text: string = ''): void {
        Swal.fire({
            title,
            text,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }

    static info(title: string, text: string = ''): void {
        Swal.fire({
            title,
            text,
            icon: 'info',
            confirmButtonText: 'OK'
        });
    }

    static warning(title: string, text: string = ''): void {
        Swal.fire({
            title,
            text,
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }
}
