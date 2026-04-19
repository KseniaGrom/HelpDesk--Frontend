import './styles.css';
import API from './api';

class HelpDeskApp {
    constructor() {
        this.api = new API();
        this.tickets = [];
        this.init();
    }
    
    async init() {
        this.showLoading();
        await this.loadTickets();
        this.setupEventListeners();
    }
    
   showLoading() {
    const container = document.getElementById('ticketsList');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <svg class="loading-spinner" width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#e0e0e0" stroke-width="3"/>
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#667eea" stroke-width="3" 
                            stroke-dasharray="100" stroke-dashoffset="75" stroke-linecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="1s" repeatCount="indefinite"/>
                    </circle>
                </svg>
                <span class="loading-text">Загрузка тикетов...</span>
            </div>
        `;
    }
}
    
    async loadTickets() {
        try {
            this.tickets = await this.api.getAllTickets();
            this.renderTickets();
        } catch (error) {
            console.error('Error loading tickets:', error);
            const container = document.getElementById('ticketsList');
            if (container) {
                container.innerHTML = '<div class="error">Ошибка загрузки тикетов</div>';
            }
        }
    }
    
    renderTickets() {
        const container = document.getElementById('ticketsList');
        
        if (!this.tickets || this.tickets.length === 0) {
            container.innerHTML = '<div class="empty">Нет заявок. Создайте первую!</div>';
            return;
        }
        
        container.innerHTML = '';
        
        this.tickets.forEach(ticket => {
            const ticketElement = this.createTicketElement(ticket);
            container.appendChild(ticketElement);
        });
    }
    
    createTicketElement(ticket) {
        const div = document.createElement('div');
        div.className = 'ticket-item';
        div.dataset.id = ticket.id;
        
        const createdDate = new Date(ticket.created).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        div.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-status ${ticket.status ? 'completed' : 'incomplete'}" data-action="toggle"></div>
                <div class="ticket-name">${this.escapeHtml(ticket.name)}</div>
                <div class="ticket-created">${createdDate}</div>
                <div class="ticket-actions">
                    <button class="btn-edit" data-action="edit">✎</button>
                    <button class="btn-delete" data-action="delete">✗</button>
                </div>
            </div>
            <div class="ticket-description" style="display: none;"></div>
        `;

        const header = div.querySelector('.ticket-header');
        header.addEventListener('click', async (e) => {
            if (e.target.closest('[data-action]')) return;
            await this.toggleDescription(div, ticket.id);
        });

        div.querySelector('[data-action="toggle"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStatus(ticket);
        });
        
        div.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editTicket(ticket);
        });
        
        div.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTicket(ticket);
        });
        
        return div;
    }
    
    async toggleDescription(element, ticketId) {
        const descriptionDiv = element.querySelector('.ticket-description');
        
        if (descriptionDiv.style.display === 'block') {
            descriptionDiv.style.display = 'none';
            return;
        }

        try {
            const fullTicket = await this.api.getTicketById(ticketId);
            const descriptionText = fullTicket.description && fullTicket.description.trim() 
                ? fullTicket.description 
                : 'Нет описания';
            descriptionDiv.innerHTML = this.escapeHtml(descriptionText).replace(/\n/g, '<br>');
            descriptionDiv.style.display = 'block';
        } catch (error) {
            console.error('Error loading description:', error);
            descriptionDiv.innerHTML = 'Ошибка загрузки описания';
            descriptionDiv.style.display = 'block';
        }
    }
    
    async toggleStatus(ticket) {
        try {
            const newStatus = !ticket.status;
            await this.api.updateTicket(ticket.id, ticket.name, ticket.description, newStatus);
            await this.loadTickets();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Ошибка при изменении статуса');
        }
    }
    
    editTicket(ticket) {
        this.showTicketForm(ticket);
    }
    
    async deleteTicket(ticket) {
        const confirmed = confirm(`Удалить тикет\n\nВы уверены, что хотите удалить тикет "${ticket.name}"? Это действие необратимо.`);
        
        if (confirmed) {
            try {
                await this.api.deleteTicket(ticket.id);
                await this.loadTickets();
            } catch (error) {
                console.error('Error deleting ticket:', error);
                alert('Ошибка при удалении тикета');
            }
        }
    }
    
    showTicketForm(ticket = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        const isEdit = !!ticket;
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${isEdit ? 'Редактировать тикет' : 'Добавить тикет'}</h2>
                <form id="ticketForm">
                    <div class="form-group">
                        <label for="ticketName">Краткое описание</label>
                        <input type="text" id="ticketName" name="name" required 
                               value="${this.escapeHtml(ticket?.name || '')}">
                    </div>
                    <div class="form-group">
                        <label for="ticketDescription">Подробное описание</label>
                        <textarea id="ticketDescription" name="description">${this.escapeHtml(ticket?.description || '')}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel" id="cancelBtn">Отмена</button>
                        <button type="submit" class="btn-submit">Ок</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#ticketForm');
        const cancelBtn = modal.querySelector('#cancelBtn');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const name = formData.get('name');
            const description = formData.get('description');
            
            if (!name.trim()) {
                alert('Введите краткое описание');
                return;
            }
            
            try {
                if (isEdit) {
                    await this.api.updateTicket(ticket.id, name, description, ticket.status);
                } else {
                    await this.api.createTicket(name, description);
                }
                modal.remove();
                await this.loadTickets();
            } catch (error) {
                console.error('Error saving ticket:', error);
                alert('Ошибка при сохранении');
            }
        });
        
        cancelBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    setupEventListeners() {
        const addBtn = document.getElementById('addTicketBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showTicketForm());
        }
    }
    
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new HelpDeskApp();
    });
} else {
    window.app = new HelpDeskApp();
}