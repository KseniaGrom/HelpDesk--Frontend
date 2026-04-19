export default class TicketDetails {
    constructor(api) {
        this.api = api;
    }
    
    async showDeleteConfirm(ticket, onConfirm) {
        const confirmed = confirm(`Вы уверены, что хотите удалить заявку "${ticket.name}"?`);
        if (confirmed) {
            try {
                await this.api.deleteTicket(ticket.id);
                onConfirm();
            } catch (error) {
                console.error('Ошибка удаления:', error);
                alert('Ошибка при удалении заявки');
            }
        }
    }
}