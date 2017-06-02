import React from 'react';
import DygraphBase from 'dygraphs-commonjs';
import {propTypes as dygraphPropTypes, spreadProps as spreadKnownProps} from './Dygraph/options';

class InteractionModelProxy {
    constructor() {
        const interactionModelHandlers = ['mousedown', 'touchstart', 'touchmove', 'touchend', 'dblclick', 'mousewheel'];
        for (const method of interactionModelHandlers) {
            const thisProxy = this;
            this[method] = function (...args) {
                const calledContext = this;
                const handlerDefinedInInteractionModel = thisProxy._target[method];
                if(handlerDefinedInInteractionModel) {
                    return thisProxy._target[method].call(calledContext, ...args);
                }
            };
        }
        ['willDestroyContextMyself'].forEach(prop => {
            Object.defineProperty(this, prop, {
                configurable: false,
                enumerable: true,
                get: () => this._target[prop],
                set: value => this._target[prop] = value
            });
        });
    }

    _target = DygraphBase.Interaction.defaultModel;
}

export default class Dygraph extends React.Component {
    displayName = 'Dygraph';

    static propTypes = Object.assign({style: React.PropTypes.object}, dygraphPropTypes);

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const {known: {selection, ...initAttrs}} = spreadKnownProps(this.props, true);
        this._interactionProxy._target =
            initAttrs.interactionModel || DygraphBase.Interaction.defaultModel;
        initAttrs.interactionModel = this._interactionProxy;
        this._dygraph = new DygraphBase(this.root, this.props.data, initAttrs);
        if(typeof selection !== 'undefined') {
            this._dygraph.setSelection(...selection);
        }
    }

    getDygraph() {
        return this._dygraph;
    }

    componentWillUpdate(nextProps/*, nextState*/) {
        if (this._dygraph) {
            const {known: {selection, ...updateAttrs}} = spreadKnownProps(nextProps, false);
            this._interactionProxy._target =
                updateAttrs.interactionModel || DygraphBase.Interaction.defaultModel;
            updateAttrs.interactionModel = this._interactionProxy;
            this._dygraph.updateOptions(updateAttrs);
            if(typeof selection !== 'undefined') {
                this._dygraph.setSelection(...selection);
            }
        }
    }

    componentWillUnmount() {
        if (this._dygraph) {
            this._dygraph.destroy();
            this._dygraph = null;
        }
    }

    _interactionProxy = new InteractionModelProxy();

    render() {
        return (
            <div
                ref={(root) => this.root = root}
                style={this.props.style}
            />
        );
    }
}
