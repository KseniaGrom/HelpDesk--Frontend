export default class API {
    constructor() {
        this.useLocalStorage = true;
        this.initStorage();
    }
    
    initStorage() {
        if (!localStorage.getItem('helpdesk_tickets')) {
            const demoTickets = [
                {
                    id: crypto.randomUUID(),
                    name: "Поменять краску в принтере, ком. 404",
                    description: "Принтер HP LJ-1210, картриджи на складе",
                    status: false,
                    created: Date.now() - 7 * 24 * 60 * 60 * 1000,
                },
                {
                    id: crypto.randomUUID(),
                    name: "Переустановить Windows, ПК-Hall24",
                    description: "",
                    status: false,
                    created: Date.now() - 2 * 24 * 60 * 60 * 1000,
                },
                {
                    id: crypto.randomUUID(),
                    name: "Установить обновление КВ-XXX",
                    description: "Вышло критическое обновление для Windows",
                    status: false,
                    created: Date.now() - 1 * 24 * 60 * 60 * 1000,
                },
            ];
            localStorage.setItem('helpdesk_tickets', JSON.stringify(demoTickets));
        }
    }
    
    async getAllTickets() {
        const tickets = JSON.parse(localStorage.getItem('helpdesk_tickets') || '[]');
        return tickets.map(({ description, ...ticket }) => ticket);
    }
    
    async getTicketById(id) {
        const tickets = JSON.parse(localStorage.getItem('helpdesk_tickets') || '[]');
        return tickets.find(t => t.id === id);
    }
    
    async createTicket(name, description, status = false) {
        const tickets = JSON.parse(localStorage.getItem('helpdesk_tickets') || '[]');
        const newTicket = {
            id: crypto.randomUUID(),
            name,
            description: description || "",
            status,
            created: Date.now(),
        };
        tickets.push(newTicket);
        localStorage.setItem('helpdesk_tickets', JSON.stringify(tickets));
        return newTicket;
    }
    
    async updateTicket(id, name, description, status) {
        const tickets = JSON.parse(localStorage.getItem('helpdesk_tickets') || '[]');
        const index = tickets.findIndex(t => t.id === id);
        if (index !== -1) {
            tickets[index] = { 
                ...tickets[index], 
                name, 
                description: description || "", 
                status 
            };
            localStorage.setItem('helpdesk_tickets', JSON.stringify(tickets));
        }
        return { success: true };
    }
    
    async deleteTicket(id) {
        const tickets = JSON.parse(localStorage.getItem('helpdesk_tickets') || '[]');
        const filtered = tickets.filter(t => t.id !== id);
        localStorage.setItem('helpdesk_tickets', JSON.stringify(filtered));
        return { success: true };
    }
}