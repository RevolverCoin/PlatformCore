const { Map, fromJS } = require('immutable')

const assert = require('assert')

const { distributeReward } = require('reward-core')
const NodeType = require('reward-core/NodeType')

const { createGetNodeFeeFunc } = require('../src/core/reward/reward')

describe('Test rewards', () => {
  it('completes reward distribution', () => {
    const initialState = fromJS({
      nodes: [
        {
          id: 0,
          type: NodeType.GENERATOR,
        },
        {
          id: 1,
          type: NodeType.AUTHOR,
        },
        {
          id: 2,
          type: NodeType.SUPPORTER,
        },
      ],
      edges: [
        {
          source: 0,
          target: 1,
        },

        {
          source: 2,
          target: 1,
        },
      ],
    })

    const block = Map({ finderId: 0, subsidy: 10 })
    const getNodeFee = createGetNodeFeeFunc(initialState.get('edges'), 0.1, 0.5)

    const state = distributeReward({ state: initialState, block, getNodeFee })
    const rewards = state
      .get('nodes')
      .map(node => fromJS({ id: node.get('id'), reward: node.get('reward') }))

    assert.deepEqual(rewards.toJS(), [
      { id: 0, reward: 1 },
      { id: 1, reward: 4.5 },
      { id: 2, reward: 0.45 },
    ])
  })

  it('completes reward distribution when reverse support', () => {
    const initialState = fromJS({
      nodes: [
        {
          id: 0,
          type: NodeType.GENERATOR,
        },
        {
          id: 1,
          type: NodeType.AUTHOR,
        },
        {
          id: 2,
          type: NodeType.SUPPORTER,
        },
      ],
      edges: [
        {
          source: 1,
          target: 0,
        },

        {
          source: 2,
          target: 1,
        },
      ],
    })

    const block = Map({ finderId: 0, subsidy: 10 })
    const getNodeFee = createGetNodeFeeFunc(initialState.get('edges'), 0.1, 0.5)

    const state = distributeReward({ state: initialState, block, getNodeFee })
    const rewards = state
      .get('nodes')
      .map(node => fromJS({ id: node.get('id'), reward: node.get('reward') }))

    assert.deepEqual(rewards.toJS(), [
      { id: 0, reward: 1 },
      { id: 1, reward: 0.9 },
      { id: 2, reward: 0.81 },
    ])
  })

})
