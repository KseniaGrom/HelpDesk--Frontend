export default class TicketForm {
    constructor(api, onSubmit, onClose) {
        this.api = api;
        this.onSubmit = onSubmit;
        this.onClose = onClose;
        this.modalContainer = document.getElementById('modalContainer');
        this.ticket = null;
    }
    
    show(ticket = null) {
        this.ticket = ticket;
        this.renderModal();
    }
    
    renderModal() {
        const isEdit = !!this.ticket;
        const title = isEdit ? 'Редактировать заявку' : 'Новая заявка';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${title}</h2>
                <form id="ticketForm">
                    <div class="form-group">
                        <label for="ticketName">Краткое описание *</label>
                        <input type="text" id="ticketName" name="name" required 
                               value="${this.escapeHtml(this.ticket?.name || '')}">
                    </div>
                    <div class="form-group">
                        <label for="ticketDescription">Подробное описание</label>
                        <textarea id="ticketDescription" name="description">${this.escapeHtml(this.ticket?.description || '')}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-close" id="cancelBtn">Отмена</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Сохранить' : 'Создать'}</button>
                    </div>
                </form>
            </div>
        `;
        
        this.modalContainer.appendChild(modal);
        
        const form = modal.querySelector('#ticketForm');
        const cancelBtn = modal.querySelector('#cancelBtn');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(form);
        });
        
        cancelBtn.addEventListener('click', () => {
            this.close();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
    }
    
    async handleSubmit(form) {
        const formData = new FormData(form);
        const name = formData.get('name');
        const description = formData.get('description');
        
        if (!name.trim()) {
            alert('Пожалуйста, введите краткое описание');
            return;
        }
        
        try {
            if (this.ticket) {
                // Обновляем существующий тикет
                await this.api.updateTicket(
                    this.ticket.id, 
                    name, 
                    description, 
                    this.ticket.status
                );
            } else {
                // Создаем новый тикет
                await this.api.createTicket(name, description);
            }
            this.close();
            if (this.onSubmit) {
                this.onSubmit();
            }
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка при сохранении заявки: ' + error.message);
        }
    }
    
    close() {
        if (this.modalContainer) {
            this.modalContainer.innerHTML = '';
        }
        this.ticket = null;
        if (this.onClose) {
            this.onClose();
        }
    }
    
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}