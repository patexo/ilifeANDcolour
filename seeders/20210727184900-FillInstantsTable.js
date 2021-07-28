'use strict';

module.exports = {
    up(queryInterface, Sequelize) {

        return queryInterface.bulkInsert('Instants', [
            {
                title: 'Faro de Peñas',
                description: 'Majestuoso faro que se encuentra en lo más alto del acantilado, coronándolo. En el Cabo de Peñas, lo más al norte del norte de Asturias, en España.',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Llocantaro.',
                description: 'Cangrejo.',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Llámpara.',
                description: 'Pegadas a las rocas, intnetando no caerse.',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Percebe.',
                description: 'Molusco de sabor apreciadísimo. La esencia del mar al paladar.',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    down(queryInterface, Sequelize) {

        return queryInterface.bulkDelete('Instants', null, {});
    }
};