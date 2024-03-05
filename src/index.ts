import './client';
import cineplexHelper from './helpers/cineplex-helper';
import usvisaHelper from './helpers/usvisa-helper';
import './keep_alive';
usvisaHelper.monitorVisaDatesAvailability();
cineplexHelper.monitorCineplexesAvailability();