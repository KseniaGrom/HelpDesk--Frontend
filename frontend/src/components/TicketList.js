export default class TicketList {
    constructor(api, onEdit, onDelete, onToggleStatus) {
        this.api = api;
        this.onEdit = onEdit;
        this.onDelete = onDelete;
        this.onToggleStatus = onToggleStatus;
        this.element = document.getElementById('ticketsList');
        this.expandedTicketId = null;
    }

    async render() {
        try {
            this.showLoading();
            const tickets = await this.api.getAllTickets();
            this.displayTickets(tickets);
        } catch (error) {
            this.showError('Ошибка загрузки тикетов: ' + error.message);
            console.error(error);
        }
    }

    displayTickets(tickets) {
        if (!tickets || tickets.length === 0) {
            this.element.innerHTML = '<div class="loading">Нет заявок. Создайте первую!</div>';
            return;
        }

        this.element.innerHTML = '';
        
        tickets.forEach(ticket => {
            const ticketElement = this.createTicketElement(ticket);
            this.element.appendChild(ticketElement);
        });
    }

    createTicketElement(ticket) {
        const div = document.createElement('div');
        div.className = 'ticket-item';
        div.dataset.id = ticket.id;
        
        const createdDate = new Date(ticket.created).toLocaleString('ru-RU');
        
        div.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-status ${ticket.status ? 'completed' : 'incomplete'}" data-action="toggle"></div>
                <div class="ticket-name">${this.escapeHtml(ticket.name)}</div>
                <div class="ticket-created">${createdDate}</div>
                <div class="ticket-actions">
                    <button class="btn btn-edit" data-action="edit">✏️</button>
                    <button class="btn btn-delete" data-action="delete">🗑️</button>
                </div>
            </div>
        `;
        
        if (this.expandedTicketId === ticket.id) {
            this.loadTicketDescription(div, ticket.id);
        }

        const header = div.querySelector('.ticket-header');
        header.addEventListener('click', async (e) => {
            if (e.target.closest('[data-action]')) return;
            
            if (this.expandedTicketId === ticket.id) {
                this.collapseTicket(div, ticket.id);
            } else {
                await this.expandTicket(div, ticket.id);
            }
        });
        
        // Handle action buttons
        const toggleBtn = div.querySelector('[data-action="toggle"]');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onToggleStatus(ticket);
            });
        }
        
        const editBtn = div.querySelector('[data-action="edit"]');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onEdit(ticket);
            });
        }
        
        const deleteBtn = div.querySelector('[data-action="delete"]');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onDelete(ticket);
            });
        }
        
        return div;
    }
    
    async expandTicket(element, ticketId) {
        if (this.expandedTicketId) {
            const prevExpanded = document.querySelector(`.ticket-item[data-id="${this.expandedTicketId}"]`);
            if (prevExpanded) {
                this.collapseTicket(prevExpanded, this.expandedTicketId);
            }
        }
        
        this.expandedTicketId = ticketId;
        await this.loadTicketDescription(element, ticketId);
    }
    
    collapseTicket(element, ticketId) {
        const descriptionDiv = element.querySelector('.ticket-description');
        if (descriptionDiv) {
            descriptionDiv.remove();
        }
        if (this.expandedTicketId === ticketId) {
            this.expandedTicketId = null;
        }
    }
    
    async loadTicketDescription(element, ticketId) {
        try {
            const ticket = await this.api.getTicketById(ticketId);
            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'ticket-description';
            const descriptionText = ticket.description && ticket.description.trim() 
                ? ticket.description 
                : 'Нет описания';
            descriptionDiv.innerHTML = this.escapeHtml(descriptionText);
            element.appendChild(descriptionDiv);
        } catch (error) {
            console.error('Ошибка загрузки описания:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'ticket-description';
            errorDiv.innerHTML = 'Ошибка загрузки описания';
            errorDiv.style.color = '#f44336';
            element.appendChild(errorDiv);
        }
    }
    
    showLoading() {
        this.element.innerHTML = '<div class="loading">Загрузка...</div>';
    }
    
    showError(message) {
        this.element.innerHTML = `<div class="error">${message}</div>`;
    }
    
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    refresh() {
        this.render();
    }
}