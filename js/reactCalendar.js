/** @jsx React.DOM */

function layOutDay(events) {

    //Event calculations and interval-scheduling logic

    var eventLayoutCalculator = {

        //variable declarations for calendar columns

        eventArray: events,
        calendarColumnArray: [],
        referencePointEvent: null,
        currentColumn: [],
        CALENDAR_WRAPPER_WIDTH: 600,
        resumeRenderingHere: 0,
        hasCollisions: false,

        createCalendarColumnArray: function(){
            this.orderEvents();
            this.columnizeDayCalendarEvents();
            this.adjustColumnWidths("last", 2);
            return this.calendarColumnArray;
        },

        //sort events based on start & end times

        orderEvents: function() {
            this.eventArray.sort(function (event1, event2) {
                if (event1.start > event2.start) return  1;
                if (event1.start < event2.start) return -1;
                if (event1.end > event2.end) return  1;
                if (event1.end < event2.end) return -1;
                return 0;
            });
        },

        //column-based organization of calendar events

        columnizeDayCalendarEvents: function(){
            do {
                this.referencePointEvent = this.eventArray.shift();
                this.configureReferencePointEvent(this.referencePointEvent);
                this.currentColumn.push(this.referencePointEvent);
                if (this.eventArray.length > 0) this.createEventsColumn();
                this.calendarColumnArray.push(this.currentColumn);
                this.currentColumn = [];
                this.resumeRenderingHere = 0;
            } while(this.eventArray.length);
        },

        //position event used as reference for subsequent events in column

        configureReferencePointEvent: function(referencePointEvent){
            referencePointEvent.top = referencePointEvent.start;
            referencePointEvent.height = referencePointEvent.end - referencePointEvent.start;
            referencePointEvent.width =
                Math.floor(this.CALENDAR_WRAPPER_WIDTH/(this.calendarColumnArray.length + 1));
            referencePointEvent.left = (referencePointEvent.width * this.calendarColumnArray.length) + 10;
        },

        //add events to appropriate column using reference point event

        createEventsColumn: function(){
            do {
                var newReferencePointEvent = this.locateEventCollisions();
                if(newReferencePointEvent){
                    this.referencePointEvent = newReferencePointEvent.event;
                    this.resumeRenderingHere = newReferencePointEvent.eventIndex;
                    if (this.eventArray.splice(newReferencePointEvent.eventIndex, 1)) this.resumeRenderingHere--;
                    if (this.resumeRenderingHere < 0) this.resumeRenderingHere = 0;
                    this.configureReferencePointEvent(this.referencePointEvent);
                    this.currentColumn.push(this.referencePointEvent);
                }
                var cond = (this.hasCollisions)?
                    (this.resumeRenderingHere < this.eventArray.length-1) :
                    (this.resumeRenderingHere < this.eventArray.length);
            } while(cond);
        },

        //collisions to determine appropriate number of columns

        locateEventCollisions: function(){
            for (var i = this.resumeRenderingHere; i < this.eventArray.length; i++) {
                if (this.hasZeroEventCollisions(this.referencePointEvent, this.eventArray[i])){
                    return { event: this.eventArray[i], eventIndex: i}
                } else {
                    this.hasCollisions = true;
                    this.resumeRenderingHere = i;
                }
            }
        },

        hasZeroEventCollisions: function(referencePointEvent, event){
            return event.start >= this.referencePointEvent.end;
        },

        //ensure no overlap

        adjustColumnWidths: function(order, iterationCount){
            var column, comparisonColumn;
            do {
                if (order === "last") {
                    for(column = this.calendarColumnArray.length-1; column > 0; column--) {
                        comparisonColumn = column-1;
                        this.iterateThroughColumnArrays(column, comparisonColumn);
                    }
                    order = "first";
                } else {
                    for(column = 0; column < this.calendarColumnArray.length-1; column++) {
                        comparisonColumn = column + 1;
                        this.iterateThroughColumnArrays(column, comparisonColumn);
                    }
                    order = "last";
                }
                iterationCount--;
            } while(iterationCount > 0);

            //iterate through first column to adjust full-span elements

            var cond1, cond2;
            for (var i = 0; i < this.calendarColumnArray[0].length; i++) {
                if (this.calendarColumnArray[0][i].width === this.CALENDAR_WRAPPER_WIDTH) {
                    for (var j = 1; j < this.calendarColumnArray.length; j++) {
                        for (var k = 0; k < this.calendarColumnArray[j].length; k++) {
                            cond1 = this.calendarColumnArray[0][i].end > this.calendarColumnArray[j][k].end
                                && this.calendarColumnArray[0][i].start < this.calendarColumnArray[j][k].end;
                            cond2 = this.calendarColumnArray[0][i].start < this.calendarColumnArray[j][k].start
                                && this.calendarColumnArray[0][i].end > this.calendarColumnArray[j][k].start;
                            if (cond1 || cond2) {
                                this.calendarColumnArray[0][i].width = this.CALENDAR_WRAPPER_WIDTH -
                                    (this.CALENDAR_WRAPPER_WIDTH * (this.calendarColumnArray.length - j) / this.calendarColumnArray.length);
                            }
                        }
                    }


                }
            }

        },

        //comparison-based adjustment of event column widths

        iterateThroughColumnArrays: function(column, comparisonColumn){
            var cond1, cond2, cond3;
            for (var i = 0; i < this.calendarColumnArray[column].length; i++){
                for (var j = 0; j < this.calendarColumnArray[comparisonColumn].length; j++){
                    cond1 = ((this.calendarColumnArray[column][i].start > this.calendarColumnArray[comparisonColumn][j].start)
                        && (this.calendarColumnArray[column][i].start < this.calendarColumnArray[comparisonColumn][j].end) );
                    cond2 = (((this.calendarColumnArray[column][i].start >= this.calendarColumnArray[comparisonColumn][j].start)
                        && (this.calendarColumnArray[column][i].end <= this.calendarColumnArray[comparisonColumn][j].end))
                        || ((this.calendarColumnArray[column][i].start <= this.calendarColumnArray[comparisonColumn][j].start)
                        && (this.calendarColumnArray[column][i].end >= this.calendarColumnArray[comparisonColumn][j].end)));
                    cond3 = ((this.calendarColumnArray[column][i].end > this.calendarColumnArray[comparisonColumn][j].start)
                        && (this.calendarColumnArray[column][i].end < this.calendarColumnArray[comparisonColumn][j].end));
                    if (cond1 || cond2 || cond3) {
                        if (this.calendarColumnArray[column][i].width > this.calendarColumnArray[comparisonColumn][j].width) {
                            this.calendarColumnArray[column][i].width = this.calendarColumnArray[comparisonColumn][j].width;
                        }
                        if (this.calendarColumnArray[column][i].width < this.calendarColumnArray[comparisonColumn][j].width) {
                            this.calendarColumnArray[comparisonColumn][j].width = this.calendarColumnArray[column][i].width;
                        }
                        this.calendarColumnArray[comparisonColumn][j].left =
                            (this.calendarColumnArray[comparisonColumn][j].width * comparisonColumn) + 10;
                    }
                }
            }
        }
    };

    var layoutMatrix = eventLayoutCalculator.createCalendarColumnArray();

    //React: top-down UI build :)

    var DayCalendar = React.createClass({
        render: function() {
            return (
                <div>
                    <DayCalendarTimeIntervals />
                    <DayCalendarEventsLayout layout={this.props.layout} />
                </div>
            );
        }
    });

    var DayCalendarTimeIntervals = React.createClass({
        render: function() {
            return (
                <ul>
                    <li><strong>9:00</strong> AM</li>
                    <li>9:30</li>
                    <li><strong>10:00</strong> AM</li>
                    <li>10:30</li>
                    <li><strong>11:00</strong> AM</li>
                    <li>11:30</li>
                    <li><strong>12:00</strong> PM</li>
                    <li>12:30</li>
                    <li><strong>1:00</strong> PM</li>
                    <li>1:30</li>
                    <li><strong>2:00</strong> PM</li>
                    <li>2:30</li>
                    <li><strong>3:00</strong> PM</li>
                    <li>3:30</li>
                    <li><strong>4:00</strong> PM</li>
                    <li>4:30</li>
                    <li><strong>5:00</strong> PM</li>
                    <li>5:30</li>
                    <li><strong>6:00</strong> PM</li>
                    <li>6:30</li>
                    <li><strong>7:00</strong> PM</li>
                    <li>7:30</li>
                    <li><strong>8:00</strong> PM</li>
                    <li>8:30</li>
                    <li><strong>9:00</strong> PM</li>
                </ul>
            );
        }
    });

    var DayCalendarEventsLayout = React.createClass({
        render: function() {
           var layoutMatrix = this.props.layout,
               eventStylings = [];
           for (var i = 0; i < layoutMatrix.length; i++) {
               for(var j = 0; j < layoutMatrix[i].length; j++){
                   if(layoutMatrix[i][j].start < 720 && layoutMatrix[i][j].start >= 0){
                        eventStylings.push({top: layoutMatrix[i][j].top + "px", left: layoutMatrix[i][j].left + "px",
                        width: layoutMatrix[i][j].width + "px", height: layoutMatrix[i][j].height + "px", id:
                        parseInt(layoutMatrix[i][j].top,10) + 37 * parseInt(layoutMatrix[i][j].left,10) });
                   }
               }
           }
           return (
               <div id="day-calendar-wrapper">
                    {eventStylings.map(function(eventStyling) {
                        return <DayCalendarEvent key={eventStyling.id} style={eventStyling} />
                    })}
               </div>
           );
       }
    });

    var DayCalendarEvent = React.createClass({
       render: function() {
           return (
               <div className="day-calendar-event" style={{top: this.props.style.top, left: this.props.style.left,
                   width: this.props.style.width, height: this.props.style.height}}>
                   <span className="sample-item">Sample Item</span><br></br>
                   <span>Sample Location</span>
               </div>
           );
       }
    });

    React.renderComponent(<DayCalendar layout={layoutMatrix} />, document.getElementById('dayCalendar'));
}

layOutDay([ {start:	30,	end: 150}, {start: 540,	end: 600}, {start: 560, end: 620},	{start:	610, end: 670} ]);


